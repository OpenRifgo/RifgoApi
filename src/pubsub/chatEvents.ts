import mitt, {Emitter} from 'mitt';
import App from '../App';
import {ChatMessage} from '../entity/ChatMessage';

type ChatEvents = {
  messageRemoved?: {
    chatMessage: ChatMessage,
  }
};

export const chatEvents: Emitter<ChatEvents> = mitt<ChatEvents>();

const app = App.getInstance();

// Send email with link when paid
chatEvents.on('messageRemoved', async (data) => {

  app.wsModule.broadcastByTopic(
    `event:${data.chatMessage.eventId}`,
    {
      module: 'chat',
      event: 'messageRemoved',
      data: {
        chatMessage: {
          id: data.chatMessage.id,
        },
      },
    },
  );

});
