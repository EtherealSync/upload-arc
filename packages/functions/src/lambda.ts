import { SQS } from 'aws-sdk';
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


    if(messages.Messages && messages.Messages.length > 0){
      console.log(`Recieved ${messages.Messages.length} messages`);

      // Write logic for checking tasks in fargate cluster 
      // if tasks < 10 then invoke task and delete or do nothing 

      for(const message of messages.Messages){
        console.log(`Message consumed`);
        console.log(message)
        if(message.ReceiptHandle){
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
