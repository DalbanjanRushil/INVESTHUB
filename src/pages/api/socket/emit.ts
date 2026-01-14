import { NextApiRequest } from "next";

export default async function handler(req: NextApiRequest, res: any) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { event, data } = req.body;

    if (res.socket?.server?.io) {
        res.socket.server.io.emit(event, data);
        return res.status(200).json({ message: "Event emitted" });
    }

    res.status(500).json({ error: "Socket server not running" });
}
