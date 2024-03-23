import React, {useState} from 'react';

const SwitchCheckbox = ({initialState = false, callback}) => {
    const [isChecked, setIsChecked] = useState(initialState);

    const toggleSwitch = () => {
        setIsChecked(!isChecked);
        typeof callback === 'function' && callback(!isChecked);
    };

    return (
        <label className='switch'>
            <input
                type='checkbox'
                checked={isChecked}
                onChange={toggleSwitch}
            />
            <span className='slider round'></span>
        </label>
    );
};

export default SwitchCheckbox;
