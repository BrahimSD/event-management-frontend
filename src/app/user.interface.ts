export interface User {
    username: string;
    email?: string;
    role?: string;
    avatar?: string;
    about?: string;
    location?: string;
    followers?: string[];
    following?: string[];
    createdEvents?: any[];
    attendedEvents?: any[];
    isFollowing?: boolean;
  }
  
export interface FollowResponse {
    username: string;
    followers: string[];
    following: string[];
  }