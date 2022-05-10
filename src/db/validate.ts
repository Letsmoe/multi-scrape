import fetch from "node-fetch";
import { Response } from "../types.js";

export async function validateToken(token: string, username: string, password: string): Promise<boolean> {
	const request = await fetch(`http://porn-search.me/api/token/validate.php?token=${token}&username=${username}&password=${password}`);
	const content = (await request.json() as Response);
	
	if (content.status === "error") {
		return false;
	} else {
		return true;
	}
}