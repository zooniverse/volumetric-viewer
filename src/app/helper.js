export const indexToPoint = (index, base) => {
  const square = Math.pow(base, 2);
	
	return [
		Math.floor(index / square),
		Math.floor((index % square) / base),
		index % base
	];
}

export const pointToIndex = (point, base) => {
	const {x, y, z} = point;
  const square = Math.pow(base, 2);

	return (x * square) + (y * base) + z;
}

export const pixelToPercent = (value) => {
	// 255 => 100%
	// 0 => 0%
	// 127.5 => 50%
	return `${Math.round((value / 255) * 100)}%`;	// normalize is some way
}

export const pointColor = ({ isPointActive = false, pointValue }) => {
	const pointNormed = Math.floor(pointValue / 2) + 64;

	const colorStr = (isPointActive)
		? `hsl(120, 75%, ${pixelToPercent(pointNormed)})`
		: `hsl(205, 0%, ${pixelToPercent(pointNormed)})`;
	return colorStr;
}

export const genId = () => Math.random().toString(36).slice(2);
