import fetch from "node-fetch";
export async function validateToken(token, username, password) {
    const request = await fetch(`http://porn-search.me/api/token/validate.php?token=${token}&username=${username}&password=${password}`);
    const content = await request.json();
    if (content.status === "error") {
        return false;
    }
    else {
        return true;
    }
}
