import { InputRange } from "./InputRange.js";
import { InputRangeDual } from "./InputRangeDual.js";

export const Config = ({
  pointPlane,
  setPointPlane,
	setThreshold,
  threshold,
  points
}) => {
	return (
		<>
			<h3>Brightness Range</h3>
			<InputRangeDual 
				valueMax={255}
				valueMin={0}
				valueMaxCurrent={threshold.max}
				valueMinCurrent={threshold.min}
				onChange={(min, max) => {
					setThreshold({ min, max });
				}}
			/>
			<br />
			<br />

			{points.dimensions.map((dimensionName, dimension) => {
				return <div key={`dimension-${dimensionName}-${pointPlane[dimension]}`}>
					<h3>{dimensionName.toUpperCase()} Plane Coordinate</h3>
					<InputRange
						onChange={value => {
							setPointPlane(points.setPointDimension({
								point: pointPlane,
								dimension: dimension,
								value: value - 1,
							}));
						}}
						valueCurrent={pointPlane[dimension] + 1}
						valueMax={points.base}
						valueMin={1}
					/>
					<br />
					<br />
				</div>
			})}
		</>
	);
};