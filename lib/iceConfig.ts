/**
 * WebRTC ICE server configuration.
 *
 * STUN servers help two peers discover a direct path to each other.
 * That's often enough — but behind stricter NATs/firewalls (mobile carriers,
 * corporate networks, some home routers) a direct connection can't be made,
 * and traffic needs to be relayed through a TURN server instead.
 *
 * The TURN servers below are the free public "Open Relay" project
 * (https://www.metered.ca/tools/openrelay/) — fine for personal use with
 * friends. For heavier or production use, sign up for a free Metered.ca
 * account (or similar) and swap in your own credentials.
 */
export const ICE_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun.relay.metered.ca:80' },
    {
      urls: 'turn:global.relay.metered.ca:80',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:global.relay.metered.ca:443',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: 'turn:global.relay.metered.ca:443?transport=tcp',
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
};
