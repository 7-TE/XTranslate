import styles from "./number-input.module.scss";
import React from "react";
import { Input, InputProps } from "./input";
import { Icon } from "../icon";
import { autoBind, cssNames } from "../../utils";

interface Props extends InputProps<number> {
}

export class NumberInput extends React.Component<Props> {
  public input: Input;

  constructor(props: Props) {
    super(props);
    autoBind(this);
  }

  increment() {
    var inputElem = this.input.input as HTMLInputElement;
    inputElem.stepUp();
    this.input.setValue(inputElem.valueAsNumber);
  }

  decrement() {
    var inputElem = this.input.input as HTMLInputElement;
    inputElem.stepDown();
    this.input.setValue(inputElem.valueAsNumber);
  }

  bindRef(input: Input) {
    this.input = input;
  }

  render() {
    var { className, ...inputProps } = this.props;
    className = cssNames(styles.NumberInput, className);
    return (
      <Input
        {...inputProps}
        type="number"
        className={className}
        labelContent={(
          <div className={styles.arrowIcons}>
            <Icon
              material="arrow_drop_up"
              className={styles.Icon}
              onClick={this.increment}
            />
            <Icon
              material="arrow_drop_down"
              className={styles.Icon}
              onClick={this.decrement}
            />
          </div>
        )}
        ref={this.bindRef}
      />
    );
  }
}
