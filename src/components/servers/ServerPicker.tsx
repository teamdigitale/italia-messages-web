import React, { ChangeEvent, Component } from "react";

import { Col, Input, InputGroup, InputGroupAddon, Row } from "design-react-kit";

import Trash from "react-icons/lib/fa/trash";

type ServerPickerProps = {
  server: any;
  endpoint: any;
  checked: any;
  disabled?: any;
  onServerSelect: any;
  onServerChange: any;
  onServerDelete?: any;
};

class ServerPicker extends Component<ServerPickerProps, never> {
  public render() {
    const {
      server,
      endpoint,
      checked,
      disabled,
      onServerSelect,
      onServerChange,
      onServerDelete
    } = this.props;

    return (
      <Row>
        <Col lg="1" className="d-flex align-items-center">
          <Input
            type="radio"
            checked={checked}
            name="server"
            className="shadow-none"
            onChange={() => onServerSelect(server)}
          />
        </Col>
        <Col>
          <InputGroup size="sm">
            <Input
              type="text"
              value={endpoint}
              disabled={disabled}
              onChange={({
                target: { value }
              }: ChangeEvent<HTMLInputElement>) =>
                onServerChange(server, value)
              }
            />
            {onServerDelete && (
              <InputGroupAddon
                addonType="append"
                onClick={() => onServerDelete(server)}
              >
                <span className="input-group-text cursor-pointer">
                  <Trash />
                </span>
              </InputGroupAddon>
            )}
          </InputGroup>
        </Col>
      </Row>
    );
  }
}

export default ServerPicker;
