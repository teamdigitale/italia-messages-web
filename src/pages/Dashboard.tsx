import React, { Component } from "react";

import { WithNamespaces, withNamespaces } from "react-i18next";

import { Find } from "react-pouchdb/browser";

import { Card, CardBody, CardText, CardTitle } from "design-react-kit";

import Notification from "../components/notifications/Notification";

import { RouteComponentProps } from "react-router";
import "./Dashboard.css";

type DashboardProps = RouteComponentProps & WithNamespaces;

class Dashboard extends Component<DashboardProps, never> {
  public render() {
    const { location, t } = this.props;

    return (
      <section className="d-flex">
        <section className="position-fixed dashboard--notifications-container">
          {location.state &&
            location.state.map((info: any) => {
              return <Notification key={info._id} info={info} />;
            })}
        </section>
        <Find
          selector={{
            type: "template"
          }}
          render={({ docs }: any) => {
            return (
              <Card className="flex-1 bg-primary text-white p-3 m-3">
                <CardBody>
                  <CardTitle className="display-1">{docs.length}</CardTitle>
                  <CardText>{t("templates")}</CardText>
                </CardBody>
              </Card>
            );
          }}
        />
        <Find
          selector={{
            type: "message"
          }}
          render={({ docs }: any) => {
            return (
              <Card className="flex-1 bg-primary text-white p-3 m-3">
                <CardBody>
                  <CardTitle className="display-1">{docs.length}</CardTitle>
                  <CardText>{t("messages")}</CardText>
                </CardBody>
              </Card>
            );
          }}
        />
        <Find
          selector={{
            type: "contact"
          }}
          render={({ docs }: any) => {
            return (
              <Card className="flex-1 bg-primary text-white p-3 m-3">
                <CardBody>
                  <CardTitle className="display-1">{docs.length}</CardTitle>
                  <CardText>{t("contacts")}</CardText>
                </CardBody>
              </Card>
            );
          }}
        />
      </section>
    );
  }
}

export default withNamespaces("dashboard")(Dashboard);
