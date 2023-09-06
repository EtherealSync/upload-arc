import { SQS } from 'aws-sdk';
import { Job } from 'sst/node/job';
import { Queue } from 'sst/node/queue';

const sqs = new SQS();

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
            
            const info = JSON.parse(message.Body)

            if(!info['PRIMARY_KEY_METADATA'] || !info['SORT_KEY_METADATA'] || !info['PRIMARY_KEY_TOKEN'] || !info['SORT_KEY_TOKEN'] || !info['S3_OBJECT_KEY'] || !info['S3_BUCKET_NAME']){
                return {
                  statusCode: 400,
                  body: JSON.stringify({ status: "Bad request, check message body" }),
                }
            }

            Job.upload.run({
              payload: {
                'PRIMARY_KEY_METADATA': info['PRIMARY_KEY_METADATA'],
                'SORT_KEY_METADATA' : info['SORT_KEY_METADATA'],
                'PRIMARY_KEY_TOKEN' : info['PRIMARY_KEY_TOKEN'],
                'SORT_KEY_TOKEN' : info['SORT_KEY_TOKEN'],
                'S3_OBJECT_KEY' : info['S3_OBJECT_KEY'],
                'S3_BUCKET_NAME' : info['S3_BUCKET_NAME']
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
