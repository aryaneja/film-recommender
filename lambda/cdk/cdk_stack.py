from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_apigateway as rest_api,
    aws_iam as iam,
    aws_dynamodb as dynamodb,
    Duration
)
from aws_cdk.aws_lambda_python_alpha import PythonFunction
from constructs import Construct
import os

class LetterboxdStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        parser_lambda = PythonFunction(
            self,
            "LetterboxdParserFunction",
            entry=os.path.join(os.path.dirname(__file__), "../function"),  # path to parser.py + requirements.txt
            runtime=_lambda.Runtime.PYTHON_3_11,
            index="parser.py",  # file name
            handler="lambda_handler",  # function name
            function_name="letterboxd_parser"
        )

        api = rest_api.LambdaRestApi(
            self,
            "LetterboxdParserApi",
            handler=parser_lambda,
            rest_api_name="LetterboxdParserApi",
            deploy_options=rest_api.StageOptions(stage_name="prod"),
            default_cors_preflight_options=rest_api.CorsOptions(
                allow_origins=rest_api.Cors.ALL_ORIGINS,
                allow_methods=rest_api.Cors.ALL_METHODS,
            )
        )

        # Create a DynamoDB table
        film_table = dynamodb.Table(
            self,
            "FilmTable",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
        )

        # Create a new DynamoDB table for Bedrock Recommendations
        bedrock_recommendations_table = dynamodb.Table(
            self,
            "BedrockRecommendations",
            table_name="BedrockRecommendations",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(name="movieId", type=dynamodb.AttributeType.NUMBER),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST
        )

        # Create a new Lambda function for DynamoDB interactions
        dynamodb_lambda = PythonFunction(
            self,
            "DynamoDBHandlerFunction",
            entry=os.path.join(os.path.dirname(__file__), "../function"),  # path to dynamodb_handler.py
            runtime=_lambda.Runtime.PYTHON_3_11,
            index="dynamodb_handler.py",  # file name
            handler="lambda_handler",  # function name
            function_name="dynamodb_handler"
        )

        # Create a new Lambda function for Bedrock recommendations
        bedrock_lambda = PythonFunction(
            self,
            "BedrockRecommenderFunction",
            entry=os.path.join(os.path.dirname(__file__), "../function"),  # path to bedrock_recommender.py
            runtime=_lambda.Runtime.PYTHON_3_11,
            index="bedrock_recommender.py",  # file name
            handler="lambda_handler",  # function name
            function_name="bedrock_recommender",
            timeout=Duration.seconds(30)
        )

        # Grant Bedrock permissions to both Lambda functions
        bedrock_permissions_policy = iam.PolicyStatement(
            actions=["bedrock:*"],
            resources=["*"],  # Be cautious with this, consider limiting to specific models/arns
            effect=iam.Effect.ALLOW
        )
        dynamodb_lambda.add_to_role_policy(
            bedrock_permissions_policy
        )
        bedrock_lambda.add_to_role_policy(
            iam.PolicyStatement(
                actions=["dynamodb:*"], resources=[bedrock_recommendations_table.table_arn], effect=iam.Effect.ALLOW
            ),
        )

        # Grant the new Lambda function permissions to read/write to the table
        film_table.grant_read_write_data(dynamodb_lambda)

        # Pass the table name as an environment variable to the new Lambda function
        dynamodb_lambda.add_environment("FILM_TABLE_NAME", film_table.table_name)

        # grant read and write to bedrock table
        bedrock_recommendations_table.grant_read_write_data(bedrock_lambda)
        bedrock_lambda.add_environment("BEDROCK_TABLE_NAME", bedrock_recommendations_table.table_name)

        # Add API Gateway endpoints for the new Lambda function
        dynamodb_api = api.root.add_resource("dynamodb")
        dynamodb_api.add_method("POST", rest_api.LambdaIntegration(dynamodb_lambda))
        dynamodb_api.add_method("GET", rest_api.LambdaIntegration(dynamodb_lambda))

        # Add API Gateway endpoints for the Bedrock Recommender Lambda function
        bedrock_api = api.root.add_resource("bedrock")
        bedrock_api.add_method("POST", rest_api.LambdaIntegration(bedrock_lambda))