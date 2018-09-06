import React, { Component, Fragment } from "react";

import { withDB } from "react-pouchdb/browser";

import { Link } from "react-router-dom";

import FaChevronRight from "react-icons/lib/fa/chevron-right";

import { getStatsFor } from "../../utils/";

import moment from "moment";

class MessageStats extends Component {
  state = {
    statuses: {}
  };

  componentDidMount = async () => {
    const { entry, db } = this.props;
    const statuses = await getStatsFor(entry, db);

    this.setState({
      statuses
    });
  };

  render() {
    const { statuses } = this.state;
    const { templates, entry } = this.props;

    return (
      <tr className="font-weight-bold">
        <td>{moment(entry.message.created_at).format("DD/MM/YYYY, HH:mm")}</td>
        <td className="text-word-break">
          {templates[entry.templateId].subject}
        </td>
        <td>{statuses.PROCESSED}</td>
        <td>{statuses.ERRORED}</td>
        <td>{statuses.QUEUED}</td>
        <td>
          <Link
            className="large list-item"
            to={{ pathname: `/report/${entry.type}/${entry._id}` }}
          >
            <FaChevronRight />
          </Link>
        </td>
      </tr>
    );
  }
}

export default withDB(MessageStats);
