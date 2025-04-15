from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_apigateway as rest_api,
    aws_dynamodb as dynamodb,
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

        # Grant the new Lambda function permissions to read/write to the table
        film_table.grant_read_write_data(dynamodb_lambda)

        # Pass the table name as an environment variable to the new Lambda function
        dynamodb_lambda.add_environment("FILM_TABLE_NAME", film_table.table_name)

        # Add API Gateway endpoints for the new Lambda function
        dynamodb_api = api.root.add_resource("dynamodb")
        dynamodb_api.add_method("POST", rest_api.LambdaIntegration(dynamodb_lambda))
        dynamodb_api.add_method("GET", rest_api.LambdaIntegration(dynamodb_lambda))