import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DatePickerPopover } from '../DatePickerPopover';

const formatLabel = () => 'Выбрать дату';

describe('DatePickerPopover', () => {
  it('показывает календарь для даты, загруженной после первого рендера', async () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <DatePickerPopover value="" onChange={onChange} formatLabel={formatLabel} />,
    );
    rerender(
      <DatePickerPopover value="2026-11-17" onChange={onChange} formatLabel={formatLabel} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Выбрать дату' }));
    await userEvent.click(screen.getByRole('button', { name: '18' }));
    expect(onChange).toHaveBeenCalledWith('2026-11-18');
  });

  it('переходит из марта в февраль без пропуска месяца', async () => {
    const onChange = vi.fn();
    render(<DatePickerPopover value="2026-03-01" onChange={onChange} formatLabel={formatLabel} />);
    await userEvent.click(screen.getByRole('button', { name: 'Выбрать дату' }));
    await userEvent.click(screen.getByRole('button', { name: 'Предыдущий месяц' }));
    await userEvent.click(screen.getByRole('button', { name: '15' }));
    expect(onChange).toHaveBeenCalledWith('2026-02-15');
  });
});
