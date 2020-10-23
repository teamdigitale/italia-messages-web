import React, { ChangeEvent } from "react";

import { ServiceMetadata } from "io-functions-commons/dist/generated/definitions/ServiceMetadata";

import { ServiceScopeEnum } from "io-functions-commons/dist/generated/definitions/ServiceScope";

import { WithNamespaces, withNamespaces } from "react-i18next";

type OwnProps = {
  service_metadata?: ServiceMetadata;
  isApiAdmin: boolean;
  onChange: (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => void;
};

type Props = WithNamespaces & OwnProps;

/**
 * Array containing all keys of ServiceMetadata, and for each of them an input is created inside the form.
 * See https://github.com/pagopa/io-developer-portal-frontend/pull/139
 */
export const MetadataKeys = ServiceMetadata.type.types.reduce(
  (p, e) => [...p, ...Object.keys(e.props)],
  [] as readonly string[]
);

const MetadataInput = ({
  service_metadata,
  onChange,
  isApiAdmin,
  t
}: Props) => {
  return isApiAdmin ? (
    // All input text Metadata (except 'scope' that is an enumeration)
    <div>
      {MetadataKeys.filter(k => k !== "scope").map((k, i) => (
        <div key={i}>
          <label className="m-0">{t(k)}</label>
          <input
            name={k}
            type="text"
            defaultValue={Object(service_metadata)[k]}
            onChange={onChange}
            className="mb-4"
          />
        </div>
      ))}
      <div>
        <label className="m-0">{t("scope")}*</label>
        <select
          name="scope"
          value={service_metadata ? service_metadata.scope : undefined}
          className="form-control mb-4"
          onChange={onChange}
        >
          <option
            key={ServiceScopeEnum.NATIONAL}
            value={ServiceScopeEnum.NATIONAL}
          >
            {ServiceScopeEnum.NATIONAL}
          </option>
          <option key={ServiceScopeEnum.LOCAL} value={ServiceScopeEnum.LOCAL}>
            {ServiceScopeEnum.LOCAL}
          </option>
        </select>
      </div>
    </div>
  ) : null;
};

export default withNamespaces("service")(MetadataInput);