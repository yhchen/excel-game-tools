const NUMCHAR = '0123456789';

const WORDSCHAR = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
export function FindWord(s: string, idx?: number): { start: number, end: number, len: number, } | undefined {
	let first = true;
	let start = 0, end = s.length - 1;
	for (let i = idx ? idx : 0; i < s.length; ++i) {
		if (first) {
			if (s[i] == ' ' || s[i] == '	')
				continue;
			if (WORDSCHAR.indexOf(s[i]) < 0)
				return undefined;
			first = false;
			start = i;
			continue;
		}
		if (WORDSCHAR.indexOf(s[i]) < 0) {
			end = i - 1;
			break;
		}
	}
	return (end >= start) && !first ? { start, end, len: end - start + 1 } : undefined;
}

export function FindNum(s: string, idx?: number): { start: number, end: number, len: number, } | undefined {
	let first = true;
	let start = 0, end = s.length - 1;
	for (let i = idx ? idx : 0; i < s.length; ++i) {
		if (first) {
			if (s[i] == ' ' || s[i] == '	') continue;
			if (NUMCHAR.indexOf(s[i]) < 0)
				return undefined;
			first = false;
			start = i;
			continue;
		}
		if (NUMCHAR.indexOf(s[i]) < 0) {
			end = i - 1;
			break;
		}
	}
	return (end >= start) && !first ? { start, end, len: end - start + 1 } : undefined;
}
