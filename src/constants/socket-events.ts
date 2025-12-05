export enum SocketEvent {
  // Message
  SEND_MESSAGE = 'sendMessage',
  MESSAGES_READ = 'messagesRead',
  MESSAGE_RECEIVED = 'messageReceived',
  CONNECTED_USERS = 'connectedUsers',
  // Video
  RTC_CONNECTION = 'rtcConnection',
  CALL_REQUEST = 'callRequest',
  CALL_RESPONSE = 'callResponse',
  CALL_END = 'callEnd',
  CALL_MEDIA_STATE = 'callMediaState',
}
