import React from "react";
import PropTypes from "prop-types";
import Paragraph from "../Paragraph/Paragraph.jsx";
import SubTitle from "../SubTitle/SubTitle.jsx";
import "./ClientShowcase.styles.scss";

export default function ClientShowcase({
  eyebrow,
  title,
  description,
  clients = [],
  className = "",
}) {
  const visibleClients = Array.isArray(clients) ? clients.filter((client) => client?.name) : [];

  return (
    <section
      className={`trem-client-showcase${visibleClients.length ? "" : " is-empty"}${className ? ` ${className}` : ""}`}
    >
      <header className="trem-client-showcase__header">
        {eyebrow ? <span className="trem-client-showcase__eyebrow">{eyebrow}</span> : null}
        {title ? (
          <SubTitle
            text={title}
            variant="primary"
            size="large"
            primaryClassname="trem-client-showcase__title"
          />
        ) : null}
        {description ? (
          <Paragraph
            text={description}
            variant="body"
            size="small"
            primaryClassname="trem-client-showcase__description"
          />
        ) : null}
      </header>
      {visibleClients.length ? (
        <div className="trem-client-showcase__list" role="list">
          {visibleClients.map((client) => (
            <div className="trem-client-showcase__client" role="listitem" key={client.id || client.name}>
              {client.logo?.src ? (
                <img src={client.logo.src} alt={client.logo.alt || ""} loading="lazy" />
              ) : (
                <span aria-hidden="true">{client.initial || client.name.slice(0, 1)}</span>
              )}
              <strong>{client.name}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

ClientShowcase.propTypes = {
  eyebrow: PropTypes.string,
  title: PropTypes.string,
  description: PropTypes.string,
  clients: PropTypes.arrayOf(PropTypes.object),
  className: PropTypes.string,
};
