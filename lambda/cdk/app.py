import aws_cdk as cdk
import os
from cdk_stack import LetterboxdParserStack

app = cdk.App()

LetterboxdParserStack(
    app,
    "LetterboxdParserStack",
    env=cdk.Environment(
        account=os.environ["CDK_DEFAULT_ACCOUNT"],
        region=os.environ["CDK_DEFAULT_REGION"],
    ),
)

app.synth()