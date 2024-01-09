function normalizeYCoordinate(y: number) {
	return (y / 540) * window.innerHeight;
}

function normalizeXCoordinate(x: number) {
	return (x / 960) * window.innerWidth;
}

function lerp(a:number , b:number , t: number) {
	return a + t * (b - a);
}

export {
	normalizeYCoordinate,
	normalizeXCoordinate,
	lerp,
}
