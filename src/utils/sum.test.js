import Sum from './sum';

test('adds 1 + 2 to equal 3', () => {
  expect(new Sum(1, 2).Add()).toBe(3);
});
