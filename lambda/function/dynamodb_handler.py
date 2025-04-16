from decimal import Decimal
import os
import boto3
import json

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('FILM_TABLE_NAME')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
    try:
        user_id = event['requestContext']['authorizer']['claims']['email']
        http_method = event.get('httpMethod')

        if http_method == 'POST':
            # Parse and convert the body
            body = json.loads(event['body'], parse_float=Decimal)
            film_list = body.get('filmList', [])
            table.put_item(Item={
                'userId': user_id,
                'filmList': film_list
            })
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
                },
                'body': json.dumps({'message': 'Film list saved successfully'})
            }

        elif http_method == 'GET':
            try:
                response = table.get_item(Key={'userId': user_id})
                item = response.get('Item', {})
                if not item:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                            'Access-Control-Allow-Headers': 'Content-Type,Authorization'
                        },
                        'body': json.dumps({'error': 'User not found'})
                    }
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
                    },
                    'body': json.dumps({'filmList': item.get('filmList', [])})
                }
            except Exception as e:
                return {
                    'statusCode': 500,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
                    },
                    'body': json.dumps({'error': f'Failed to fetch film list: {str(e)}'})
                }

        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            'body': json.dumps({'message': 'Unsupported HTTP method'})
        }
    except KeyError as e:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            'body': json.dumps({'error': f'Missing key: {str(e)}'})
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            'body': json.dumps({'error': str(e)})
        }