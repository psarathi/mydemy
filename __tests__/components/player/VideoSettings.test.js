import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VideoSettings from '../../../components/player/VideoSettings';

describe('VideoSettings', () => {
    const mockOnClose = jest.fn();
    let localStorageGetItemSpy;
    let localStorageSetItemSpy;

    beforeEach(() => {
        jest.clearAllMocks();
        localStorageGetItemSpy = jest.spyOn(Storage.prototype, 'getItem');
        localStorageSetItemSpy = jest.spyOn(Storage.prototype, 'setItem');
        localStorageGetItemSpy.mockReturnValue(null);
    });

    afterEach(() => {
        localStorageGetItemSpy.mockRestore();
        localStorageSetItemSpy.mockRestore();
    });

    test('renders nothing when isOpen is false', () => {
        const { container } = render(<VideoSettings isOpen={false} onClose={mockOnClose} />);

        expect(container.firstChild).toBeNull();
    });

    test('renders modal when isOpen is true', () => {
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText('Video Player Settings')).toBeInTheDocument();
    });

    test('renders countdown duration setting', () => {
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText('Autoplay Countdown Duration')).toBeInTheDocument();
        expect(screen.getByText('Time before the next video plays automatically (3-60 seconds)')).toBeInTheDocument();
    });

    test('renders slider input with correct attributes', () => {
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const slider = screen.getByRole('slider');
        expect(slider).toBeInTheDocument();
        expect(slider).toHaveAttribute('min', '3');
        expect(slider).toHaveAttribute('max', '60');
        expect(slider).toHaveAttribute('step', '1');
    });

    test('renders number input with default value of 10', () => {
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const numberInput = screen.getByRole('spinbutton');
        expect(numberInput).toBeInTheDocument();
        expect(numberInput).toHaveValue(10);
    });

    test('renders save and cancel buttons', () => {
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText('Save Changes')).toBeInTheDocument();
        expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    test('calls onClose when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const closeButton = screen.getByLabelText('Close settings');
        await user.click(closeButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when overlay is clicked', async () => {
        const user = userEvent.setup();
        const { container } = render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const overlay = container.querySelector('.video-settings-overlay');
        await user.click(overlay);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('does not close when modal content is clicked', async () => {
        const user = userEvent.setup();
        const { container } = render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const modal = container.querySelector('.video-settings-modal');
        await user.click(modal);

        expect(mockOnClose).not.toHaveBeenCalled();
    });

    test('updates value when slider is changed', async () => {
        const user = userEvent.setup();
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const slider = screen.getByRole('slider');
        fireEvent.change(slider, { target: { value: '30' } });

        const numberInput = screen.getByRole('spinbutton');
        expect(numberInput).toHaveValue(30);
    });

    test('updates value when number input is changed', async () => {
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const numberInput = screen.getByRole('spinbutton');
        fireEvent.change(numberInput, { target: { value: '45' } });

        expect(numberInput).toHaveValue(45);
    });

    test('saves to localStorage when save button is clicked', async () => {
        const user = userEvent.setup();
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const slider = screen.getByRole('slider');
        fireEvent.change(slider, { target: { value: '25' } });

        const saveButton = screen.getByText('Save Changes');
        await user.click(saveButton);

        expect(localStorageSetItemSpy).toHaveBeenCalledWith('autoplayCountdownDuration', '25');
    });

    test('dispatches autoplaySettingsUpdated event when save is clicked', async () => {
        const user = userEvent.setup();
        const dispatchEventSpy = jest.spyOn(window, 'dispatchEvent');

        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const slider = screen.getByRole('slider');
        fireEvent.change(slider, { target: { value: '20' } });

        const saveButton = screen.getByText('Save Changes');
        await user.click(saveButton);

        expect(dispatchEventSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'autoplaySettingsUpdated',
                detail: { countdownDuration: 20 }
            })
        );

        dispatchEventSpy.mockRestore();
    });

    test('calls onClose after saving', async () => {
        const user = userEvent.setup();
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const saveButton = screen.getByText('Save Changes');
        await user.click(saveButton);

        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    test('loads saved duration from localStorage on mount', () => {
        localStorageGetItemSpy.mockReturnValue('35');

        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const numberInput = screen.getByRole('spinbutton');
        expect(numberInput).toHaveValue(35);
    });

    test('enforces minimum value of 3', async () => {
        const user = userEvent.setup();
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const numberInput = screen.getByRole('spinbutton');
        await user.clear(numberInput);
        await user.type(numberInput, '2');

        // Value should not be accepted (stays at previous or min)
        expect(numberInput.value).not.toBe('2');
    });

    test('enforces maximum value of 60', async () => {
        const user = userEvent.setup();
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const numberInput = screen.getByRole('spinbutton');
        await user.clear(numberInput);
        await user.type(numberInput, '65');

        // Value should not be accepted (stays at previous or max)
        expect(numberInput.value).not.toBe('65');
    });

    test('accepts valid values within range', async () => {
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const numberInput = screen.getByRole('spinbutton');
        fireEvent.change(numberInput, { target: { value: '15' } });

        expect(numberInput).toHaveValue(15);
    });

    test('renders slider and number input in sync', async () => {
        const user = userEvent.setup();
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const slider = screen.getByRole('slider');
        const numberInput = screen.getByRole('spinbutton');

        fireEvent.change(slider, { target: { value: '40' } });

        expect(numberInput).toHaveValue(40);
    });

    test('renders "seconds" label', () => {
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        expect(screen.getByText('seconds')).toBeInTheDocument();
    });

    test('has correct class names for styling', () => {
        const { container } = render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        expect(container.querySelector('.video-settings-overlay')).toBeInTheDocument();
        expect(container.querySelector('.video-settings-modal')).toBeInTheDocument();
        expect(container.querySelector('.settings-header')).toBeInTheDocument();
        expect(container.querySelector('.settings-content')).toBeInTheDocument();
        expect(container.querySelector('.settings-footer')).toBeInTheDocument();
    });

    test('reloads saved value when isOpen changes from false to true', () => {
        localStorageGetItemSpy.mockReturnValue('40');

        const { rerender } = render(<VideoSettings isOpen={false} onClose={mockOnClose} />);

        rerender(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const numberInput = screen.getByRole('spinbutton');
        expect(numberInput).toHaveValue(40);
    });

    test('renders close button with correct aria-label', () => {
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const closeButton = screen.getByLabelText('Close settings');
        expect(closeButton).toBeInTheDocument();
    });

    test('slider has correct accessibility label', () => {
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const slider = screen.getByRole('slider');
        expect(slider).toHaveAttribute('id', 'countdown-duration');
    });

    test('number input has min and max attributes', () => {
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const numberInput = screen.getByRole('spinbutton');
        expect(numberInput).toHaveAttribute('min', '3');
        expect(numberInput).toHaveAttribute('max', '60');
    });

    test('does not save when cancel is clicked', async () => {
        const user = userEvent.setup();
        render(<VideoSettings isOpen={true} onClose={mockOnClose} />);

        const slider = screen.getByRole('slider');
        fireEvent.change(slider, { target: { value: '50' } });

        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        expect(localStorageSetItemSpy).not.toHaveBeenCalled();
    });
});
