import { readFileSync } from 'node:fs';

// 줄바꿈: 저장소는 글 파일을 LF로 담는다(.gitattributes). 2026-11-10 전에 Windows에서 받은 사본은 같은 파일이 작업 폴더에서 CRLF라
// 캐시 토큰 해시 · 생성물 비교 · 부품 끼워 넣기는 CRLF를 LF로 맞춘 글로 한다. LF 파일은 그대로라 토큰 값이 바뀌지 않는다(#429).
export const lf = text => text.replaceAll('\r\n', '\n');

/** 글 파일을 LF 줄바꿈으로 읽는다 */
export const readText = path => lf(readFileSync(path, 'utf8'));
