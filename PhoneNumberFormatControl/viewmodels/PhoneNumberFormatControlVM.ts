/* eslint-disable @typescript-eslint/no-explicit-any */
import { ServiceProvider } from "../components/pcf-react/ServiceProvider";
import { IInputs } from "../generated/ManifestTypes";
import { ControlContextService } from "../components/pcf-react/ControlContextService";
import { ParametersChangedEventArgs } from "../components/pcf-react/ParametersChangedEventArgs";
import { PhoneNumberFormat, PhoneNumberUtil, PhoneNumber } from "google-libphonenumber";
import { decorate, observable, action } from "mobx";

export class PhoneNumberFormatControlVM {
  serviceProvider: ServiceProvider;
  controlContext: ControlContextService;
  phoneNumberFormat: PhoneNumberFormat;
  phoneNumberUtil: PhoneNumberUtil;
  parsedPhoneNumber: PhoneNumber | null = null;
  countryCode: string | null;
  countryCodeIndex: number | null = null;
  countryCodeOptions: ComponentFramework.PropertyHelper.OptionMetadata[] = [];
  phoneNumber: string | null = null;
  samplePhoneNumber: string | null = null;
  supportedRegions: string[] = [];
  showSamplePhoneNumber: boolean;
  isRequired: boolean;
  isValidPhoneNumber: boolean;

  constructor(serviceProvider: ServiceProvider) {
    this.serviceProvider = serviceProvider;
    this.phoneNumberUtil = PhoneNumberUtil.getInstance();
    this.supportedRegions = this.phoneNumberUtil.getSupportedRegions();
    this.controlContext = serviceProvider.get<ControlContextService>(ControlContextService.serviceProviderName);
    this.controlContext.onLoadEvent.subscribe(this.onLoad);
    this.controlContext.onParametersChangedEvent.subscribe(this.onInParametersChanged);
  }
  onLoad(): void {
    this.phoneNumber = this.controlContext.getParameters<IInputs>().phoneNumber.raw;
    this.countryCode = this.controlContext.getParameters<IInputs>().countryCode.raw;
    this.isRequired = this.controlContext.getParameters<IInputs>().phoneNumber.attributes?.RequiredLevel == 2;
    this.countryCodeOptions = this.supportedRegions.map((o, i) => {
      return { Label: o, Value: i, Color: "" };
    });
    let selectedIndex = -1;
    if (this.countryCode) {
      selectedIndex = this.countryCodeOptions.findIndex((f) => {
        return f.Label == this.countryCode;
      });
    } else {
      this.countryCode = "US";
      selectedIndex = this.countryCodeOptions.findIndex((f) => {
        return f.Label == "US";
      });
    }
    if (selectedIndex === -1) {
      //clean up test harness issue;
      this.countryCode = null;
      this.isValidPhoneNumber = true;
    }
    this.countryCodeIndex = selectedIndex;
    this.validatePhoneNumber();
  }
  onInParametersChanged(context: ControlContextService, args: ParametersChangedEventArgs): void {
    for (const param of args.updated) {
      switch (param) {
        case "phoneNumber":
          this.phoneNumber = args.values[param] as string | null;
          break;
        case "countryCode":
          this.countryCode = args.values[param] as string | null;
          if (this.countryCode) {
            const selectedIndex = this.countryCodeOptions.findIndex((f) => {
              return f.Label == this.countryCode;
            });
            this.countryCodeIndex = selectedIndex;
          }
          break;
      }
    }
    this.validatePhoneNumber();
    this.updateSamplePhoneNumber();
  }
  onPhoneNumberChanged(value: string | null): void {
    this.phoneNumber = value;
    this.validatePhoneNumber();
    this.updateSamplePhoneNumber();
  }
  onCountryCodeChanged(value: number | null): void {
    const countryCode =
      this.countryCodeOptions.find((f) => {
        return f.Value == value;
      })?.Label ?? "";
    this.countryCode = countryCode;
    this.countryCodeIndex = value;
    this.validatePhoneNumber();
    this.updateSamplePhoneNumber();
  }
  validatePhoneNumber(): void {
    try {
      if (this.countryCode) {
        this.parsedPhoneNumber = this.phoneNumberUtil.parseAndKeepRawInput(this.phoneNumber ?? "", this.countryCode);
        if (this.phoneNumberUtil.isValidNumberForRegion(this.parsedPhoneNumber, this.countryCode)) {
          this.phoneNumber = this.phoneNumberUtil.format(this.parsedPhoneNumber, PhoneNumberFormat.INTERNATIONAL);
          this.isValidPhoneNumber = true;
        } else {
          this.isValidPhoneNumber = false;
        }
      }
    } catch (e) {
      console.log(e.message);
    } finally {
      this.controlContext.setParameters({
        countryCode: this.countryCode,
        phoneNumber: this.phoneNumber,
      });
      this.updateSamplePhoneNumber();
    }
  }
  updateSamplePhoneNumber(): void {
    if (this.countryCode) {
      this.samplePhoneNumber = this.phoneNumberUtil.format(
        this.phoneNumberUtil.getExampleNumber(this.countryCode),
        PhoneNumberFormat.INTERNATIONAL,
      );
    }
  }
}

decorate(PhoneNumberFormatControlVM, {
  countryCode: observable,
  phoneNumber: observable,
  countryCodeOptions: observable,
  countryCodeIndex: observable,
  supportedRegions: observable,
  samplePhoneNumber: observable,
  showSamplePhoneNumber: observable,
  isValidPhoneNumber: observable,
  isRequired: observable,
  onLoad: action.bound,
  onInParametersChanged: action.bound,
  onPhoneNumberChanged: action.bound,
  onCountryCodeChanged: action.bound,
});
