import { mount } from 'enzyme';
import { act } from '@testing-library/react';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Popover from '@mui/material/Popover';
import Dapps, { DappsWithoutContext } from '../Dapps';
import Dapp from '../../components/Dapp';
import Loading from '../../components/Loading';

const dapps = [
  {
    id: 0,
    isEnabled: true,
    actions: {
      delete: jest.fn(),
    },
  },
  {
    id: 1,
    isEnabled: false,
  },
  {
    id: 2,
    isEnabled: true,
  },
];

const withApplicationContext =
  (Component, _) =>
  ({ ...props }) => {
    return <Component dapps={dapps} {...props} />;
  };

jest.mock('../../contexts/Application', () => {
  return {
    withApplicationContext,
    ConnectionStatus: {
      Connected: 'connected',
      Connecting: 'connecting',
      Disconnected: 'disconnected',
      Error: 'error',
    },
  };
});

jest.mock('@endo/eventual-send', () => ({
  E: obj =>
    new Proxy(obj, {
      get(target, propKey) {
        const method = target[propKey];
        return (...args) => method.apply(this, args);
      },
    }),
}));

test('renders a loading indicator while loading', () => {
  const component = mount(<DappsWithoutContext />);

  expect(component.find(Loading)).toHaveLength(1);
  expect(component.find(Dapp)).toHaveLength(0);
});

test('displays the dapps', () => {
  const component = mount(<Dapps />);

  expect(component.find(Dapp)).toHaveLength(2);
});

test('renders a message when there are no dapps', () => {
  const component = mount(<Dapps dapps={[]} />);

  expect(component.text()).toContain('No Dapps');
});

test('lets you remove a dapp', async () => {
  const component = mount(<Dapps />);
  const firstDappSettingsButton = component.find(IconButton).at(0);
  let firstDappPopover = component.find(Popover).at(0);
  expect(firstDappPopover.props().open).toBe(false);
  await act(async () =>
    firstDappSettingsButton
      .props()
      .onClick({ currentTarget: firstDappPopover.getDOMNode() }),
  );
  component.update();

  firstDappPopover = component.find(Popover).at(0);
  expect(firstDappPopover.props().open).toBe(true);
  await act(async () => firstDappPopover.find(Button).props().onClick());
  expect(dapps[0].actions.delete).toHaveBeenCalled();
});
