import React from 'react';
import {render, screen, fireEvent} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SwitchCheckbox from '../../../components/common/SwitchCheckbox';

describe('SwitchCheckbox', () => {
    test('renders with default unchecked state', () => {
        render(<SwitchCheckbox />);
        
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeInTheDocument();
        expect(checkbox).not.toBeChecked();
    });

    test('renders with initial checked state when initialState is true', () => {
        render(<SwitchCheckbox initialState={true} />);
        
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeChecked();
    });

    test('renders with initial unchecked state when initialState is false', () => {
        render(<SwitchCheckbox initialState={false} />);
        
        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).not.toBeChecked();
    });

    test('toggles state when clicked', async () => {
        const user = userEvent.setup();
        render(<SwitchCheckbox />);
        
        const checkbox = screen.getByRole('checkbox');
        
        // Initially unchecked
        expect(checkbox).not.toBeChecked();
        
        // Click to check
        await user.click(checkbox);
        expect(checkbox).toBeChecked();
        
        // Click to uncheck
        await user.click(checkbox);
        expect(checkbox).not.toBeChecked();
    });

    test('calls callback function with correct value when toggled', async () => {
        const mockCallback = jest.fn();
        const user = userEvent.setup();
        
        render(<SwitchCheckbox callback={mockCallback} />);
        
        const checkbox = screen.getByRole('checkbox');
        
        // First click - should call callback with true
        await user.click(checkbox);
        expect(mockCallback).toHaveBeenCalledWith(true);
        
        // Second click - should call callback with false
        await user.click(checkbox);
        expect(mockCallback).toHaveBeenCalledWith(false);
        
        expect(mockCallback).toHaveBeenCalledTimes(2);
    });

    test('calls callback with correct value when initialState is true', async () => {
        const mockCallback = jest.fn();
        const user = userEvent.setup();
        
        render(<SwitchCheckbox initialState={true} callback={mockCallback} />);
        
        const checkbox = screen.getByRole('checkbox');
        
        // Initially checked, clicking should call callback with false
        await user.click(checkbox);
        expect(mockCallback).toHaveBeenCalledWith(false);
    });

    test('does not call callback if callback is not a function', async () => {
        const user = userEvent.setup();
        
        // Should not throw error when callback is not provided
        render(<SwitchCheckbox callback="not-a-function" />);
        
        const checkbox = screen.getByRole('checkbox');
        
        // This should not throw an error
        await user.click(checkbox);
        expect(checkbox).toBeChecked();
    });

    test('does not call callback if callback is null or undefined', async () => {
        const user = userEvent.setup();
        
        render(<SwitchCheckbox callback={null} />);
        
        const checkbox = screen.getByRole('checkbox');
        
        // This should not throw an error
        await user.click(checkbox);
        expect(checkbox).toBeChecked();
    });

    test('renders with correct HTML structure', () => {
        render(<SwitchCheckbox />);
        
        const label = screen.getByRole('checkbox').closest('label');
        expect(label).toHaveClass('switch');
        
        const span = label.querySelector('span');
        expect(span).toHaveClass('slider', 'round');
    });

    test('checkbox can be toggled using keyboard (space key)', async () => {
        const mockCallback = jest.fn();
        const user = userEvent.setup();
        render(<SwitchCheckbox callback={mockCallback} />);
        
        const checkbox = screen.getByRole('checkbox');
        
        // Focus and use keyboard to toggle
        checkbox.focus();
        await user.keyboard(' ');
        
        expect(checkbox).toBeChecked();
        expect(mockCallback).toHaveBeenCalledWith(true);
    });

    test('multiple instances maintain independent state', async () => {
        const callback1 = jest.fn();
        const callback2 = jest.fn();
        const user = userEvent.setup();
        
        render(
            <>
                <SwitchCheckbox callback={callback1} data-testid="switch1" />
                <SwitchCheckbox initialState={true} callback={callback2} data-testid="switch2" />
            </>
        );
        
        const checkboxes = screen.getAllByRole('checkbox');
        const checkbox1 = checkboxes[0];
        const checkbox2 = checkboxes[1];
        
        expect(checkbox1).not.toBeChecked();
        expect(checkbox2).toBeChecked();
        
        await user.click(checkbox1);
        
        expect(checkbox1).toBeChecked();
        expect(checkbox2).toBeChecked(); // Should remain unchanged
        expect(callback1).toHaveBeenCalledWith(true);
        expect(callback2).not.toHaveBeenCalled();
    });
});