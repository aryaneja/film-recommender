from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_apigateway as rest_api,
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