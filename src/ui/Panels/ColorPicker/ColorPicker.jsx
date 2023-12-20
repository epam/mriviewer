import { SketchPicker } from 'react-color';

const ColorPicker = ({ selectedColor, onChange, sketchPickerClass }) => {
  return (
    <div>
      <SketchPicker
        disableAlpha
        width={150}
        presetColors={['#ff0000', '#00db2e', '#0000ff', '#ffffff', '#ffff00', '#05f6ff']}
        className={sketchPickerClass}
        color={selectedColor}
        onChange={onChange}
      />
    </div>
  );
};

export default ColorPicker;
