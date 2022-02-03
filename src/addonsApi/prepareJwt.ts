import * as jwt from "jsonwebtoken";

export function prepareJwt(issuer: string, secret: string): string {
    const issuedAt = Math.floor(Date.now() / 1000);
    const jwtPayload = {
        iss: issuer,
        jti: Math.random().toString(),
        iat: issuedAt,
        // 5 minute max http://addons-server.readthedocs.io/en/latest/topics/api/auth.html
        exp: issuedAt + 300
    };
    return jwt.sign(jwtPayload, secret, { algorithm: 'HS256' });
}