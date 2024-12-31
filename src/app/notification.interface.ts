export interface Notification {
    _id: string;
    userId: string;
    message: string;
    read: boolean;
    type: string;
    data?: any;
    createdAt: Date;
}