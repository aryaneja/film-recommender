from decimal import Decimal
import os
import boto3
import json
import logging

# Set up logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize DynamoDB resource
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('FILM_TABLE_NAME')
table = dynamodb.Table(table_name)

def decimal_to_float(obj):
    if isinstance(obj, list):
        return [decimal_to_float(i) for i in obj]
    elif isinstance(obj, dict):
        return {k: decimal_to_float(v) for k, v in obj.items()}
    elif isinstance(obj, Decimal):
        return float(obj)
    return obj

def lambda_handler(event, context):
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        user_id = event['requestContext']['authorizer']['claims']['email']
        http_method = event.get('httpMethod')

        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                    'Access-Control-Allow-Headers': 'Content-Type,Authorization'
                },
                'body': json.dumps({'message': 'CORS preflight OK'})
            }


        if http_method == 'POST':
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
                    'body': json.dumps({'filmList': decimal_to_float(item.get('filmList', []))})
                }
            except Exception as e:
                logger.error(f"Error fetching film list: {str(e)}")
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
        logger.warning(f"Missing key: {str(e)}")
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
        logger.error(f"Unhandled error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization'
            },
            'body': json.dumps({'error': str(e)})
        }