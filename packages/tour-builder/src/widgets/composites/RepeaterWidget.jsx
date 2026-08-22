import React, { useMemo, useState } from "react";
import { Button, Icon } from "@packages/trem-ui";
import { getPath, moveItem, joinPath } from "../../utils/paths.js";
import { evaluateCondition } from "../../utils/conditions.js";
import { validateWidgets } from "../../utils/validation.js";
import WidgetRenderer from "../WidgetRenderer.jsx";

const clone = (value) => (value == null ? value : JSON.parse(JSON.stringify(value)));

/**
 * Generic repeatable-object surface used for every embedded collection in the
 * schema (itinerary, structured activities, stays, hotel options, cancellation
 * tiers, extras, departures, destinations, search tags, reviews…).
 * One engine for all lists — operations: add / remove / duplicate / reorder /
 * collapse / expand. No per-schema list code exists anywhere else.
 */
export default function RepeaterWidget({ widget, root, basePath, onChange }) {
    const [collapsed, setCollapsed] = useState(() => new Set());
    const listPath = joinPath(basePath, widget.path);
    const items = Array.isArray(getPath(root, listPath)) ? getPath(root, listPath) : [];

    const itemErrors = useMemo(() => {
        const found = {};
        items.forEach((item, index) => {
            Object.assign(found, validateWidgets(widget.itemWidgets || [], item, `${listPath}.${index}`));
        });
        return found;
    }, [items, widget]);

    const hasErrorAt = (index) => Object.keys(itemErrors).some((key) => key.startsWith(`${listPath}.${index}.`));

    const writeList = (nextItems) => onChange(listPath, nextItems);

    const mutateItem = (index, mutator) => {
        const next = clone(items[index]);
        mutator(next);
        writeList(items.map((item, idx) => (idx === index ? next : item)));
    };

    return (
        <div className="tb-repeater" id={`tb-widget-${widget.key}`}>
            <header className="tb-repeater__head">
                <span className="tb-repeater__title">{widget.label}{items.length ? <em>({items.length})</em> : null}</span>
                {!widget.readOnly && (
                    <Button
                        type="button"
                        variant="outline"
                        color="primary"
                        primaryClassName="btn"
                        size="small"
                        iconLeft="plus"
                        text={widget.addLabel || "Add"}
                        onClick={() => writeList([...items, clone(widget.defaultItem || {})])}
                    />
                )}
            </header>

            {(widget.validation || []).filter((rule) => rule && rule.type === "MIN_ITEMS").map((rule) => (
                items.length < Number(rule.value)
                    ? <small key={rule.message} className="tb-field__error tb-repeater__rule">{rule.message}</small>
                    : null
            ))}

            {!items.length && <div className="tb-repeater__empty">{`No ${String(widget.label || "entries").toLowerCase()} yet.`}</div>}

            <div className="tb-repeater__list">
                {items.map((item, index) => {
                    const isCollapsed = collapsed.has(index);
                    const labelled = typeof widget.itemTitle === "function"
                        ? widget.itemTitle(item, index)
                        : (getPath(item, widget.itemLabelPath || "") || "");
                    let title = labelled || `${widget.label || "Item"} ${index + 1}`;
                    if (widget.numbered) {
                        const dayNo = Number(getPath(item, widget.dayNumberPath || "day") || index + 1);
                        title = `Day ${dayNo}${labelled ? ` — ${labelled}` : ""}`;
                    }
                    return (
                        <article
                            key={item?._id ?? `${widget.key}-${index}`}
                            className={`tb-card${hasErrorAt(index) ? " tb-card--invalid" : ""}${isCollapsed ? " tb-card--collapsed" : ""}`}
                        >
                            <header className="tb-card__head">
                                <button
                                    type="button"
                                    className="tb-card__toggle"
                                    aria-expanded={!isCollapsed}
                                    onClick={() => setCollapsed((current) => {
                                        const next = new Set(current);
                                        if (next.has(index)) next.delete(index); else next.add(index);
                                        return next;
                                    })}
                                >
                                    <Icon name="chevronDown" size={16} />
                                    <strong>{title}</strong>
                                </button>
                                {!widget.readOnly && (
                                    <div className="tb-card__ops" aria-label={`${title} actions`}>
                                        <Button type="button" size="small" variant="text" primaryClassName="tb-card__op" text="Up" disabled={index === 0} onClick={() => writeList(moveItem(items, index, index - 1))} />
                                        <Button type="button" size="small" variant="text" primaryClassName="tb-card__op" text="Down" disabled={index === items.length - 1} onClick={() => writeList(moveItem(items, index, index + 1))} />
                                        <Button type="button" size="small" variant="text" primaryClassName="tb-card__op" text="Duplicate" iconLeft="edit" onClick={() => writeList([...items.slice(0, index + 1), { ...clone(item), _id: undefined }, ...items.slice(index + 1)])} />
                                        <Button type="button" size="small" variant="text" color="danger" primaryClassName="tb-card__op tb-card__op--remove" text="Remove" iconLeft="x" onClick={() => writeList(items.filter((_, idx) => idx !== index))} />
                                    </div>
                                )}
                            </header>
                            {!isCollapsed && (
                                <div className="tb-card__body tb-grid">
                                    {widget.itemWidgets
                                        .filter((child) => evaluateCondition(root, child.visibleWhen))
                                        .map((child) => (
                                            <WidgetRenderer
                                                key={`${child.key}`}
                                                widget={child}
                                                root={root}
                                                basePath={`${listPath}.${index}`}
                                                onChange={onChange}
                                            />
                                        ))}
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>
        </div>
    );
}
