import { Lambda, SQS } from 'aws-sdk';
import { Function } from "sst/node/function";
import { Queue } from 'sst/node/queue';

const sqs = new SQS();
const lambda = new Lambda();

const FunctionName = process.env.UPLOAD_JOB_HANDLER_NAME as string;

export async function handler() {
  try {
    console.log('Polling SQS queue');

    const messages = await sqs.receiveMessage({
      QueueUrl: Queue.queue.queueUrl,
      MaxNumberOfMessages: 10,
      WaitTimeSeconds: 20,
    }).promise();


    if(messages.Messages && messages.Messages.length > 0){
      console.log(`Recieved ${messages.Messages.length} messages`);

      for(const message of messages.Messages){
        console.log(`Message consumed`);
        console.log(message)
        if(message.ReceiptHandle){
          
          lambda.invoke({
            FunctionName,
            InvocationType: 'Event', 
            Payload: JSON.stringify(message.Body)
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
    }

    console.log('No messages recieved');
    
  } catch (error) {
    console.error(error)
    return {
      body: JSON.stringify({ status: "error, check logs" }),
    }
  }
  
};
