import React, { Fragment } from "react";
import { BuilderContext } from "./BuilderContext.jsx";
import WidgetRenderer from "../../widgets/WidgetRenderer.jsx";
import { evaluateCondition } from "../../utils/conditions.js";

/**
 * Renders one backend step definition:
 *   substeps → children → widgets. All layout/visibility decisions come from
 *   the definition payload; this component has zero tour-specific knowledge.
 */
export default function StepRenderer({ definition, values, onChange, errors = {}, uploader = null, runtime = {} }) {
    return (
        <BuilderContext.Provider value={{ rootValues: values, uploader, runtime }}>
            <div className="tb-steps">
                {(definition?.substeps || []).map((substep) => {
                    const children = (substep.children || []).filter((child) => evaluateCondition(values, child.visibleWhen));
                    if (!children.length) return null;
                    return (
                        <section className="tb-substep" key={substep.substepKey || substep.key}>
                            {(substep.title || substep.description) && (
                                <header className="tb-substep__head">
                                    {substep.title && <h3 className="tb-substep__title">{substep.title}</h3>}
                                    {substep.description && <p className="tb-substep__desc">{substep.description}</p>}
                                </header>
                            )}
                            <div className="tb-grid">
                                {children.map((child) => (
                                    <Fragment key={child.childKey || child.key}>
                                    {(child.widgets || [])
                                        .filter((widget) => evaluateCondition(values, widget.visibleWhen))
                                        .map((widget) => (
                                            <WidgetRenderer
                                                key={widget.key}
                                                widget={widget}
                                                root={values}
                                                basePath=""
                                                onChange={onChange}
                                                errors={errors}
                                            />
                                        ))}
                                    </Fragment>
                                ))}
                            </div>
                        </section>
                    );
                })}
            </div>
        </BuilderContext.Provider>
    );
}
