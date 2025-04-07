from aws_cdk import (
    aws_lambda as _lambda,
    Stack,
)
from constructs import Construct
import os


class LetterboxdParserStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        letterboxd_parser_lambda = _lambda.Function(
            self,
            "LetterboxdParserFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="parser.lambda_handler",
            code=_lambda.Code.from_asset(os.path.dirname(__file__)),
            function_name="letterboxd_parser",
        )