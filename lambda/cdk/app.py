import aws_cdk as cdk
import os
from cdk_stack import LetterboxdStack

app = cdk.App()

LetterboxdStack(
    app,
    "LetterboxdStack",
    env=cdk.Environment(
        account=os.environ["CDK_DEFAULT_ACCOUNT"],
        region=os.environ["CDK_DEFAULT_REGION"],
    ),
)

app.synth()