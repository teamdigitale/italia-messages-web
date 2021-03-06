import React, { Component } from "react";

import { WithNamespaces, withNamespaces } from "react-i18next";
import ExistingDocument = PouchDB.Core.ExistingDocument;
import { MessageDocument } from "../../utils/operations";

type OwnProps = {
  list: ReadonlyArray<ExistingDocument<MessageDocument>>;
};
type Props = WithNamespaces & OwnProps;

class MessageListReport extends Component<Props, never> {
  public render() {
    const { list, t } = this.props;

    if (!list) {
      return null;
    }

    return (
      <table className="table mb-0 border-0">
        <thead>
          <tr>
            <th>
              <span className="display-5">{t("report.fiscal_code")}</span>
            </th>
            <th>
              <span className="display-5">{t("report.channel")}</span>
            </th>
            <th>
              <span className="display-5">{t("report.state")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map(entry => {
            /*
              The status of a notification (one for each channel).
              "SENT": the notification was succesfully sent to the channel (ie. email or push notification)
              "THROTTLED": a temporary failure caused a retry during the notification processing;
                the notification associated with this channel will be delayed for a maximum of 7 days or until the message expires
              "EXPIRED": the message expired before the notification could be sent;
                this means that the maximum message time to live was reached; no notification will be sent to this channel
              "FAILED": a permanent failure caused the process to exit with an error, no notification will be sent to this channel
            */

            const { _id, message, notification } = entry;
            const channel = notification && Object.keys(notification)[0];

            return (
              <tr key={_id}>
                <td>{message.fiscal_code}</td>
                <td>{channel}</td>
                <td>{notification && notification.email}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }
}

export default withNamespaces("messages")(MessageListReport);
