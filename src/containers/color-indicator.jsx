import PropTypes from 'prop-types';
import React from 'react';
import bindAll from 'lodash.bindall';
import parseColor from 'parse-color';
import {useIntl} from 'react-intl';

import {getSelectedLeafItems} from '../helper/selection';
import Formats, {isBitmap} from '../lib/format';
import GradientTypes from '../lib/gradient-types';

import ColorIndicatorComponent from '../components/color-indicator.jsx';
import {applyColorToSelection,
    applyGradientTypeToSelection,
    applyStrokeWidthToSelection,
    generateSecondaryColor,
    swapColorsInSelection,
    MIXED} from '../helper/style-path';

const ColorIndicator = ({label, isStroke, ...props}) => {
    const intl = useIntl();
    const [hasChanged, setHasChanged] = React.useState(false);

    React.useEffect(() => {
        const {colorModalVisible, onUpdateImage} = props;
        if (colorModalVisible && !props.colorModalVisible) {
            // Submit the new SVG, which also stores a single undo/redo action.
            if (hasChanged) onUpdateImage();
            setHasChanged(false);
        }
    }, [props.colorModalVisible, hasChanged, props.onUpdateImage]);

    const handleChangeColor = newColor => {
        // Stroke-selector-specific logic: if we change the stroke color from "none" to something visible, ensure
        // there's a nonzero stroke width. If we change the stroke color to "none", set the stroke width to zero.
        if (isStroke) {
            // Whether the old color style in this color indicator was null (completely transparent).
            // If it's a solid color, this means that the first color is null.
            // If it's a gradient, this means both colors are null.
            const oldStyleWasNull = props.gradientType === GradientTypes.SOLID ?
                props.color === null :
                props.color === null && props.color2 === null;

            const otherColor = props.colorIndex === 1 ? props.color : props.color2;
            // Whether the new color style in this color indicator is null.
            const newStyleIsNull = props.gradientType === GradientTypes.SOLID ?
                newColor === null :
                newColor === null && otherColor === null;

            if (oldStyleWasNull && !newStyleIsNull) {
                setHasChanged(applyStrokeWidthToSelection(1, props.textEditTarget) || hasChanged);
                props.onChangeStrokeWidth(1);
            } else if (!oldStyleWasNull && newStyleIsNull) {
                setHasChanged(applyStrokeWidthToSelection(0, props.textEditTarget) || hasChanged);
                props.onChangeStrokeWidth(0);
            }
        }

        const formatIsBitmap = isBitmap(props.format);
        // Apply color and update redux, but do not update svg until picker closes.
        const isDifferent = applyColorToSelection(
            newColor,
            props.colorIndex,
            props.gradientType === GradientTypes.SOLID,
            // In bitmap mode, only the fill color selector is used, but it applies to stroke if fillBitmapShapes
            // is set to true via the "Fill"/"Outline" selector button
            isStroke || (formatIsBitmap && !props.fillBitmapShapes),
            props.textEditTarget);
        setHasChanged(hasChanged || isDifferent);
        props.onChangeColor(newColor, props.colorIndex);
    };

    const handleChangeGradientType = gradientType => {
        const formatIsBitmap = isBitmap(props.format);
        // Apply color and update redux, but do not update svg until picker closes.
        const isDifferent = applyGradientTypeToSelection(
            gradientType,
            isStroke || (formatIsBitmap && !props.fillBitmapShapes),
            props.textEditTarget);
        setHasChanged(hasChanged || isDifferent);
        const hasSelectedItems = getSelectedLeafItems().length > 0;
        if (hasSelectedItems) {
            if (isDifferent) {
                // Recalculates the swatch colors
                props.setSelectedItems(props.format);
            }
        }
        if (props.gradientType === GradientTypes.SOLID && gradientType !== GradientTypes.SOLID) {
            // Generate color 2 and change to the 2nd swatch when switching from solid to gradient
            if (!hasSelectedItems) {
                props.onChangeColor(generateSecondaryColor(props.color), 1);
            }
            props.onChangeColorIndex(1);
        }
        if (props.onChangeGradientType) props.onChangeGradientType(gradientType);
    };

    const handleCloseColor = () => {
        // If the eyedropper is currently being used, don't
        // close the color menu.
        if (props.isEyeDropping) return;

        // Otherwise, close the color menu and
        // also reset the color index to indicate
        // that `color1` is selected.
        props.onCloseColor();
        props.onChangeColorIndex(0);
    };

    const handleSwap = () => {
        if (getSelectedLeafItems().length) {
            const formatIsBitmap = isBitmap(props.format);
            const isDifferent = swapColorsInSelection(
                isStroke || (formatIsBitmap && !props.fillBitmapShapes),
                props.textEditTarget);
            props.setSelectedItems(props.format);
            setHasChanged(hasChanged || isDifferent);
        } else {
            let color1 = props.color;
            let color2 = props.color2;
            color1 = color1 === null || color1 === MIXED ? color1 : parseColor(color1).hex;
            color2 = color2 === null || color2 === MIXED ? color2 : parseColor(color2).hex;
            props.onChangeColor(color1, 1);
            props.onChangeColor(color2, 0);
        }
    };

    return (
        <ColorIndicatorComponent
            {...props}
            label={intl.formatMessage(label)}
            outline={isStroke}
            onChangeColor={handleChangeColor}
            onChangeGradientType={handleChangeGradientType}
            onCloseColor={handleCloseColor}
            onSwap={handleSwap}
        />
    );
};

ColorIndicator.propTypes = {
    colorIndex: PropTypes.number.isRequired,
    disabled: PropTypes.bool.isRequired,
    color: PropTypes.string,
    color2: PropTypes.string,
    colorModalVisible: PropTypes.bool.isRequired,
    fillBitmapShapes: PropTypes.bool.isRequired,
    format: PropTypes.oneOf(Object.keys(Formats)),
    gradientType: PropTypes.oneOf(Object.keys(GradientTypes)).isRequired,
    isEyeDropping: PropTypes.bool.isRequired,
    onChangeColorIndex: PropTypes.func.isRequired,
    onChangeColor: PropTypes.func.isRequired,
    onChangeGradientType: PropTypes.func,
    onChangeStrokeWidth: PropTypes.func,
    onCloseColor: PropTypes.func.isRequired,
    onUpdateImage: PropTypes.func.isRequired,
    setSelectedItems: PropTypes.func.isRequired,
    textEditTarget: PropTypes.number
};

export default ColorIndicator;