import React, { ChangeEvent, Component, Fragment } from "react";

import { WithNamespaces, withNamespaces } from "react-i18next";
import { Find, withDB } from "react-pouchdb/browser";

import { parse } from "papaparse";

import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  Badge,
  Button,
  Card,
  Col,
  Input,
  Row
} from "design-react-kit";

import moment from "moment";
import compose from "recompose/compose";

import FaSpinner from "react-icons/lib/fa/spinner";

import ContactsList from "../components/contacts/ContactsList";
import MessageMetadataEditor from "../components/messages/MessageMetadataEditor";
import MessagePreview from "../components/messages/MessagePreview";

import { getUrl } from "../utils/api";
import { LIMITS } from "../utils/constants";
import { noticeMask } from "../utils/masks";
import {
  createMessageContent,
  messagePostAndPersist
} from "../utils/operations";
import { isMaskValid, isValueRangeValid } from "../utils/validators";
const { AMOUNT, CODE } = LIMITS;

import { GetProfileWorker } from "../workers/";

import { RouteComponentProps } from "react-router";
import "./Message.css";

type Props = {
  db: any;
  dbName: any;
};
type MessageProps = RouteComponentProps & WithNamespaces & Props;

type MessageState = {
  list: string;
  contacts: readonly any[];
  file: any;
  batch: string;
  selected: string;
  dueDate: any;
  amount: string;
  notice: string;
  recipientOpen: boolean;
  sent: boolean;
  progress: boolean;
};

class Message extends Component<MessageProps, MessageState> {
  public initialState: MessageState = {
    list: "",
    contacts: [],
    file: undefined,
    batch: "",
    selected: "",
    dueDate: undefined,
    amount: "",
    notice: "",
    recipientOpen: false,
    sent: false,
    progress: false
  };

  public state: MessageState = {
    list: this.initialState.list,
    contacts: this.initialState.contacts,
    file: this.initialState.file,
    batch: this.initialState.batch,
    selected: this.initialState.selected,
    dueDate: this.initialState.dueDate,
    amount: this.initialState.amount,
    notice: this.initialState.notice,
    recipientOpen: this.initialState.recipientOpen,
    sent: this.initialState.sent,
    progress: this.initialState.progress
  };

  public fileInput = React.createRef<HTMLInputElement>();

  public componentDidMount() {
    GetProfileWorker.addEventListener("message", ({ data }) => {
      this.setState({
        progress: this.initialState.progress,
        batch: data.batchId
      });
    });
  }

  public onToggleRecipientOpen = () => {
    this.setState(prevState => {
      return {
        recipientOpen: !prevState.recipientOpen
      };
    });
  };

  public onContactSelect = (selected: string) => {
    this.setState({ selected });
  };

  public onChangeList = ({
    target: { value }
  }: ChangeEvent<HTMLInputElement>) => {
    this.setState({
      batch: this.initialState.batch,
      contacts: this.initialState.contacts,
      file: this.initialState.file,
      list: value
    });
  };

  public onTriggerUpload = () => {
    this.fileInput.current && this.fileInput.current.click();
  };

  public onFileUpdate = ({
    target: { files }
  }: ChangeEvent<HTMLInputElement>) => {
    if (!files || !files[0]) {
      return;
    }
    parse(files[0], {
      skipEmptyLines: true,
      error: error => {
        console.error(error);
      },
      complete: (results, file) => {
        // data is an array of rows.
        // If `header` is false, rows are arrays;
        // otherwise they are objects of data keyed by the field name
        const filtered: readonly any[] = [];

        results.data.map(line =>
          line.map((value: any) => {
            // TODO Test it against validator (will be validated against API anyway)
            if (value.length === CODE.MAX) {
              filtered.push(value);
            }
          })
        );

        this.setState({
          batch: this.initialState.batch,
          file: files[0],
          list: filtered.join("\n"),
          recipientOpen: true,
          contacts: results.data
        });
      }
    });
  };

  public onChangeDueDate = (date: moment.Moment) => {
    this.setState({ dueDate: date });
  };

  public onChangeNotice = ({
    target: { value }
  }: ChangeEvent<HTMLInputElement>) => {
    this.setState({ notice: value });
  };

  public onChangeAmount = ({
    target: { value }
  }: ChangeEvent<HTMLInputElement>) => {
    this.setState({ amount: value && Number(value).toString() });
  };

  public onReset = () => {
    this.setState(this.initialState);
  };

  public onSaveContacts = () => {
    const { list } = this.state;
    const {
      db,
      dbName,
      location: {
        state: { templateId }
      }
    } = this.props;

    parse(list, {
      skipEmptyLines: true,
      error: error => {
        console.error(error);
      },
      complete: async (results, file) => {
        const batch = await db.post({
          type: "batch",
          templateId,
          created_at: moment().toISOString()
        });

        this.setState({
          progress: true,
          recipientOpen: true,
          contacts: results.data
        });
        GetProfileWorker.postMessage({
          action: "getProfile",
          dbName,
          url: getUrl(),
          batchId: batch.id,
          results: results.data
        });
      }
    });
  };

  public onMessageSubmit = async () => {
    this.setState({
      sent: true
    });

    const { batch, selected, dueDate, notice, amount } = this.state;
    const {
      db,
      t,
      location: {
        state: { type, templateId }
      }
    } = this.props;

    const messages = await db.find({
      selector: { type: "template", _id: templateId }
    });
    const message = messages.docs[0];

    const content = createMessageContent({
      message,
      dueDate,
      amount,
      notice,
      dueDateFormat: t("format:date")
    });

    const result;
    if (!batch) {
      result = [
        await messagePostAndPersist({
          db,
          code: selected,
          content,
          templateId,
          batchId: batch
        })
      ];
    } else {
      const promises: ReadonlyArray<Promise<void>> = [];
      const list = await db.find({
        selector: {
          type: "contact",
          batchId: batch
        }
      });

      list.docs.map((doc: any) =>
        promises.push(
          messagePostAndPersist({
            db,
            code: doc._id,
            content,
            templateId,
            batchId: batch
          })
        )
      );

      result = await Promise.all(promises);
    }

    this.goHome({ result });
  };

  public goHome = ({ result }: any) => {
    const { history } = this.props;
    const location = {
      pathname: "/",
      state: result
    };
    history.push(location);
  };

  public render() {
    const {
      list,
      contacts,
      file,
      batch,
      selected,
      dueDate,
      notice,
      amount,
      recipientOpen,
      sent,
      progress
    } = this.state;
    const {
      location: {
        state: { type, templateId }
      }
    } = this.props;
    const { t } = this.props;

    const isNoticeValid = isMaskValid(notice, noticeMask);
    const isAmountValid = isValueRangeValid(amount, [AMOUNT.MIN, AMOUNT.MAX]);

    return (
      <section>
        {(() => {
          return (
            <Fragment>
              <Row className="mb-5">
                <Col>
                  <Accordion className="border-0">
                    <AccordionHeader
                      className="border-0 p-2 text-decoration-none font-weight-normal"
                      active={recipientOpen}
                      onToggle={() => this.onToggleRecipientOpen()}
                    >
                      <span className="text-uppercase text-secondary">
                        {type === "single" ? t("recipient") : t("recipients")}
                      </span>
                      {(list || selected) && (
                        <Badge
                          color=""
                          className="font-weight-normal ml-3 bg-custom-pale-blue color-custom-denim-blue"
                        >
                          {(() => {
                            if (type === "single") {
                              return selected;
                            }

                            return (
                              <span>
                                {file && file.name
                                  ? `${file.name} (${contacts.length})`
                                  : contacts.length}
                              </span>
                            );
                          })()}
                        </Badge>
                      )}
                    </AccordionHeader>
                    <AccordionBody className="p-0" active={recipientOpen}>
                      {(() => {
                        if (type === "single") {
                          return (
                            <Fragment>
                              <div className="message--contacts-list mb-4">
                                <Find
                                  selector={{
                                    type: "contact"
                                  }}
                                  sort={["_id"]}
                                  render={({ docs }: any) => (
                                    <ContactsList
                                      docs={docs}
                                      selected={selected}
                                      onContactSelect={this.onContactSelect}
                                    />
                                  )}
                                />
                              </div>
                            </Fragment>
                          );
                        }

                        return (
                          <Fragment>
                            <Row>
                              <Col>
                                <Card>
                                  <Input
                                    className="flex-1 h-100 border-0 shadow-none"
                                    type="textarea"
                                    value={list}
                                    onChange={this.onChangeList}
                                  />
                                </Card>
                              </Col>
                            </Row>
                            {list && !batch && (
                              <Row>
                                <Col>
                                  <Button
                                    className="mt-3"
                                    block={true}
                                    color="primary"
                                    onClick={this.onSaveContacts}
                                    disabled={progress}
                                  >
                                    {progress ? <FaSpinner /> : t("save")}
                                  </Button>
                                </Col>
                                <Col />
                              </Row>
                            )}
                            {batch && (
                              <div className="message--contacts-list mt-4">
                                <Find
                                  selector={{
                                    type: "contact",
                                    batchId: batch
                                  }}
                                  sort={["_id"]}
                                  render={({ docs }: any) => (
                                    <ContactsList
                                      docs={docs}
                                      selected={selected}
                                    />
                                  )}
                                />
                              </div>
                            )}
                          </Fragment>
                        );
                      })()}
                    </AccordionBody>
                  </Accordion>
                </Col>
                {(() => {
                  if (type !== "single") {
                    return (
                      <Col className="col-auto border-left mb-2">
                        <header
                          className="message--recipient-upload text-uppercase text-right ml-2"
                          onClick={this.onTriggerUpload}
                        >
                          <span className="btn btn-link font-weight-bold">
                            {t("upload_file")}
                          </span>
                        </header>
                        <Input
                          className="d-none"
                          type="file"
                          ref={this.fileInput}
                          onChange={this.onFileUpdate}
                        />
                      </Col>
                    );
                  }
                })()}
              </Row>
            </Fragment>
          );
        })()}

        <div className="message--preview mb-4">
          <Find
            selector={{
              type: "template",
              _id: templateId
            }}
            sort={["_id"]}
            render={({ docs }: any) => {
              const message = docs[0];

              if (!message) {
                return null;
              }
              return <MessagePreview message={message} />;
            }}
          />
        </div>

        <MessageMetadataEditor
          dueDate={dueDate}
          notice={notice}
          amount={amount.toString()}
          isNoticeValid={isNoticeValid}
          isAmountValid={isAmountValid}
          onChangeDueDate={this.onChangeDueDate}
          onChangeNotice={this.onChangeNotice}
          onChangeAmount={this.onChangeAmount}
          onReset={this.onReset}
        />

        {(() => {
          const isValid: readonly any[] = [];
          if (dueDate) {
            isValid.push(moment(dueDate).isValid());
          }
          if (notice || amount) {
            isValid.push(isNoticeValid, isAmountValid);
          }

          if (type === "single") {
            isValid.push(!!selected);
            return (
              <Button
                className="mt-3 pl-5 pr-5"
                color="primary"
                disabled={isValid.includes(false)}
                onClick={this.onMessageSubmit}
              >
                {t("send")}
              </Button>
            );
          }

          isValid.push(!!batch);
          return (
            <Button
              className="mt-3 pl-5 pr-5"
              color="primary"
              disabled={isValid.includes(false) || sent}
              onClick={this.onMessageSubmit}
            >
              {sent ? <FaSpinner /> : t("send_batch")}
            </Button>
          );
        })()}
      </section>
    );
  }
}

const enhance = compose<MessageProps, MessageProps>(
  withDB,
  withNamespaces("message")
);

export default enhance(Message);
