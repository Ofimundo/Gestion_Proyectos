import { Request, Response } from 'express';
export declare const authController: {
    register: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    login: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    checkUsername: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    resetPasswordByUsername: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getMe: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    updateProfile: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    changePassword: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    getAllUsers: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    changeUserRole: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    toggleUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
    deleteUser: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
};
//# sourceMappingURL=authController.d.ts.map