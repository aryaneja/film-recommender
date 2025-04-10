from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
)
from aws_cdk.aws_lambda_python_alpha import PythonFunction
from constructs import Construct
import os

class LetterboxdParserStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        letterboxd_parser_lambda = PythonFunction(
            self,
            "LetterboxdParserFunction",
            entry=os.path.join(os.path.dirname(__file__), "../function"),  # path to parser.py + requirements.txt
            runtime=_lambda.Runtime.PYTHON_3_11,
            index="parser.py",  # file name
            handler="lambda_handler",  # function name
            function_name="letterboxd_parser"
        )
