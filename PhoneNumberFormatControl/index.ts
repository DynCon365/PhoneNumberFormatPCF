/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/class-name-casing */
import { StandardControlReact } from "./components/pcf-react/StandardControlReact";
import { IInputs, IOutputs } from "./generated/ManifestTypes";
import { PCFFieldControl } from "./components/PCFFieldControl";
import * as React from "react";
import * as ReactDOM from "react-dom";
import { PhoneNumberFormatControlVM } from "./viewmodels/PhoneNumberFormatControlVM";
import { CdsService } from "./viewmodels/CdsService";
import { initializeIcons } from "@uifabric/icons";
initializeIcons();

export class PhoneNumberFormatControl extends StandardControlReact<IInputs, IOutputs> {
  constructor() {
    super(true);
    this.renderOnParametersChanged = false;
    this.initServiceProvider = (serviceProvider): void => {
      serviceProvider.register(
        "CdsService",
        new CdsService(this.context, {
          phoneNumber: this.context.parameters.phoneNumber.attributes?.LogicalName,
          countryCode: this.context.parameters.countryCode.attributes?.LogicalName,
        }),
      );
      serviceProvider.register("ViewModel", new PhoneNumberFormatControlVM(serviceProvider));
    };
    this.reactCreateElement = (container, width, height, serviceProvider): void => {
      ReactDOM.render(
        React.createElement(PCFFieldControl, {
          serviceProvider: serviceProvider,
          controlWidth: width,
          controlHeight: height,
        }),
        container,
      );
    };
  }
}
