import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OtpInput from './OtpInput';

function renderOtpInput(props = {}) {
  const onChange = vi.fn();
  const utils = render(
    <OtpInput length={6} value="" onChange={onChange} {...props} />
  );
  return { onChange, ...utils };
}

describe('OtpInput', () => {
  it('renders one input box per digit', () => {
    renderOtpInput();
    expect(screen.getAllByRole('textbox')).toHaveLength(6);
  });

  it('calls onChange with the digit typed into the first box', async () => {
    const user = userEvent.setup();
    const { onChange } = renderOtpInput();

    const firstBox = screen.getByLabelText('Digit 1 of 6');
    await user.type(firstBox, '4');

    expect(onChange).toHaveBeenCalledWith('4');
  });

  it('advances focus to the next box after typing a digit', async () => {
    const user = userEvent.setup();
    renderOtpInput();

    const firstBox = screen.getByLabelText('Digit 1 of 6');
    const secondBox = screen.getByLabelText('Digit 2 of 6');
    await user.type(firstBox, '1');

    expect(secondBox).toHaveFocus();
  });

  it('calls onChange with the full pasted code', () => {
    const { onChange } = renderOtpInput();

    const firstBox = screen.getByLabelText('Digit 1 of 6');
    const pasteEvent = createPasteEvent('123456');
    firstBox.dispatchEvent(pasteEvent);

    expect(onChange).toHaveBeenCalledWith('123456');
  });

  it('moves focus back to the previous box on Backspace in an empty box', async () => {
    const user = userEvent.setup();
    renderOtpInput({ value: '1' });

    const secondBox = screen.getByLabelText('Digit 2 of 6');
    const firstBox = screen.getByLabelText('Digit 1 of 6');
    secondBox.focus();
    await user.keyboard('{Backspace}');

    expect(firstBox).toHaveFocus();
  });
});

function createPasteEvent(text) {
  const event = new Event('paste', { bubbles: true, cancelable: true });
  event.clipboardData = { getData: () => text };
  return event;
}
