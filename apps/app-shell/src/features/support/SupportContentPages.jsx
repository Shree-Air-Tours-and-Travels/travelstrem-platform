import React from "react";
import { EmptyState, SupportCategoryCard, SupportContactMethod, SupportTopicRow } from "@packages/trem-ui";
import { useNavigate, useParams } from "react-router-dom";
import { supportApi } from "./support.api";
import { useSupportResource } from "./support.hooks";
import { ResourceBoundary, SupportLayout, SupportSection } from "./SupportLayout";
import { executeSupportAction } from "./support.utils";

const ContentLists = ({ data, serviceId }) => {
  const navigate = useNavigate();
  const open = (value) => executeSupportAction(value, navigate);
  return <>
    {(data?.categories || []).length ? <SupportSection title="Help options"><div className="support-card-grid">{data.categories.map((category) => <SupportCategoryCard key={category.id} item={category} onSelect={() => navigate(`/help/new-request?serviceId=${encodeURIComponent(serviceId || "")}&category=${encodeURIComponent(category.id)}`)} />)}</div></SupportSection> : null}
    {(data?.topics || []).length ? <SupportSection title="Popular topics"><div className="support-list">{data.topics.map((topic) => <SupportTopicRow key={topic.id} topic={topic} onSelect={() => open(topic)} />)}</div></SupportSection> : null}
    <SupportSection title="Articles">{(data?.articles || []).length ? <div className="support-list">{data.articles.map((article) => <SupportTopicRow key={article.id} topic={article} onSelect={() => navigate(`/help/articles/${article.id}`)} />)}</div> : <EmptyState {...data?.emptyStates?.articles} />}</SupportSection>
    <SupportSection title="Contact support"><div className="support-list">{(data?.contactOptions || []).map((option) => <SupportContactMethod key={option.id} option={option} onSelect={() => open(option)} />)}</div></SupportSection>
  </>;
};

export function ServiceSupportPage() {
  const { serviceId } = useParams();
  const resource = useSupportResource((signal) => supportApi.service(serviceId, signal), [serviceId]);
  return <SupportLayout title={resource.data?.service?.pageTitle || "Service support"} subtitle={resource.data?.service?.pageDescription}><ResourceBoundary {...resource}><ContentLists data={{ ...resource.data, categories: resource.data?.service?.categories }} serviceId={serviceId} /></ResourceBoundary></SupportLayout>;
}

export function TopicSupportPage() {
  const { topicId } = useParams();
  const resource = useSupportResource((signal) => supportApi.topic(topicId, signal), [topicId]);
  return <SupportLayout title={resource.data?.topic?.title || "Help topic"} subtitle={resource.data?.topic?.description}><ResourceBoundary {...resource}><ContentLists data={resource.data} /></ResourceBoundary></SupportLayout>;
}

export function ContactSupportPage() {
  const navigate = useNavigate();
  const resource = useSupportResource((signal) => supportApi.contacts(signal), []);
  return <SupportLayout title="Contact support" subtitle="Choose an available way to reach the right team."><ResourceBoundary {...resource}>{resource.data?.contactOptions?.length ? <div className="support-list">{resource.data.contactOptions.map((option) => <SupportContactMethod key={option.id} option={option} onSelect={() => executeSupportAction(option, navigate)} />)}</div> : <EmptyState {...resource.data?.emptyState} />}</ResourceBoundary></SupportLayout>;
}

export function ArticlePage() {
  const { articleId } = useParams();
  const resource = useSupportResource((signal) => supportApi.article(articleId, signal), [articleId]);
  const article = resource.data?.article;
  return <SupportLayout title={article?.title || "Support article"} subtitle={article?.description}><ResourceBoundary {...resource}>{article ? <article className="support-article">{(article.sections || []).map((section) => <section key={section.id}><h2>{section.title}</h2><p>{section.body}</p></section>)}</article> : null}</ResourceBoundary></SupportLayout>;
}
