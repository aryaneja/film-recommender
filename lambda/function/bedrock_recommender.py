import json
import boto3

bedrock_runtime = boto3.client(service_name='bedrock-runtime')
MODEL_ID = 'anthropic.claude-v2'


def lambda_handler(event, context):
    user_preferences = event['user_preferences']
    
    prompt = f"""
    Human: Given the following user's movie preferences: {user_preferences}, recommend a list of 5 movies they might enjoy.
    
    Assistant: Here are 5 movie recommendations:
    """
    
    body = json.dumps({
        "prompt": prompt,
        "max_tokens_to_sample": 1000
    })
    
    response = bedrock_runtime.invoke_model(
        body=body,
        modelId=MODEL_ID,
        accept='application/json',
        contentType='application/json'
    )

    response_body = json.loads(response.get('body').read())
    recommendations_text = response_body.get('completion', '')

    recommendations = [movie.strip() for movie in recommendations_text.split("\n") if movie.strip()]

    return {
        'statusCode': 200,
        'body': json.dumps(recommendations)
    }