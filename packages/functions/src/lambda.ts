import { DynamoDB, SQS } from 'aws-sdk';
import { Job } from 'sst/node/job';
import { Queue } from 'sst/node/queue';

const sqs = new SQS();
const dynamodb = new DynamoDB.DocumentClient({region: 'ap-south-1'});

export async function handler() {
  try {
      console.log('Polling SQS queue');

      const messages = await sqs.receiveMessage({
        QueueUrl: Queue.queue.queueUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      }).promise();

      if(!messages.Messages){
        return {
          statusCode: 200,
          body: JSON.stringify({ status: "No messages recieved" }),
        }
      }
      
      console.log(`Recieved ${messages.Messages.length} messages`);

      for(const message of messages.Messages){

          console.log(`Message consumed`);
          console.log(message)

          if(message.ReceiptHandle && message.Body){
            
            let info;
            try {
              info = JSON.parse(message.Body)
            } catch (error) {
              return {
                statusCode: 400,
                body: JSON.stringify({ status: "Bad request, invalid JSON in message body" }),
              };
            }
            

            if(!info['PARTITION_KEY_TOKEN'] || !info['SORT_KEY_TOKEN'] || !info['PARTITION_KEY_METADATA'] || !info['SORT_KEY_METADATA'] || !info['S3_OBJECT_KEY'] || !info['S3_BUCKET_NAME']){
                return {
                  statusCode: 400,
                  body: JSON.stringify({ status: "Bad request, check message body" }),
                }
            }

            const channel_data =  await dynamodb.query({
                TableName: 'ethereal-sync',
                KeyConditionExpression: '#pk = :pk AND #sk = :sk',
                ExpressionAttributeNames: {
                  '#pk': 'PK',
                  '#sk': 'SK', 
                },
                ExpressionAttributeValues: {
                  ':pk': info['PARTITION_KEY_TOKEN'],
                  ':sk': info['SORT_KEY_TOKEN'], 
                },
            }).promise()

            const meta_data =  await dynamodb.query({
                TableName: 'ethereal-sync',
                KeyConditionExpression: '#pk = :pk AND #sk = :sk',
                ExpressionAttributeNames: {
                  '#pk': 'PK',
                  '#sk': 'SK', 
                },
                ExpressionAttributeValues: {
                  ':pk': info['PARTITION_KEY_METADATA'],
                  ':sk': info['SORT_KEY_METADATA'], 
                },
            }).promise()

            if(!channel_data.Items || !meta_data.Items){
              return {
                statusCode: 400,
                body: JSON.stringify({ status: "Dynamo db query returned null, check logs" }),
              }
            }

            Job.upload.run({
              payload: {
                'ACCESS_TOKEN': channel_data.Items[0]['accessToken'],
                'REFRESH_TOKEN' : channel_data.Items[0]['refreshToken'],
                'BUCKET_NAME' : info['S3_BUCKET_NAME'],
                'OBJECT_KEY' : info['S3_OBJECT_KEY'],
                'TITLE' : meta_data.Items[0]['videoTitle'],
                'DESCRIPTION' : meta_data.Items[0]['videoDescription']
              }
            })

            await sqs.deleteMessage({
              QueueUrl: Queue.queue.queueUrl,
              ReceiptHandle: message.ReceiptHandle
            }).promise()
          }
      }
      return {
        statusCode: 200,
        body: JSON.stringify({ status: "successful" }),
      }
    
    
  } catch (error) {
    console.error(error)
    return {
      statusCode: 500,
      body: JSON.stringify({ status: "Unhandled server error, check logs" }),
    }
  }
  
};
