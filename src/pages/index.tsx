import { Inter } from "next/font/google";
import { Question, ScraperState, getQuestionLinks, getQuestions } from "@/lib/scraper";
import { useContext, useEffect, useState } from "react";
import Dropdown from "@/components/ui/dropdown";
import Spinner from "@/components/ui/spinner";
import InputText from "@/components/ui/inputtext";
import { providerOptions } from "@/lib/examtopics";
import { SettingsContext } from "@/context/settings";
import Settings from "@/components/scraper/settings";
import { saveAs } from 'file-saver';

const inter = Inter({ subsets: ["latin"] });

export default function Home() {
  const [state, setState] = useState<ScraperState>({ provider: "", examCode: "" });
  const { settings } = useContext(SettingsContext);

  useEffect(() => {
    // Reset fields
    setState(prev => ({
      ...prev,
      examCode: "",
      lastDiscussionListPageIndex: undefined,
      lastQuestionLinkIndex: undefined,
      questionLinks: undefined,
      questions: undefined,
    }));
  }, [state?.provider]);

  const setIsInProgress = (value: boolean) => {
    setState(prev => ({ ...prev, isInProgress: value }));
  };

  const handleClick = async () => {
    setIsInProgress(true);
    if (isCompleted) {
      await handleExport();
    }
    else {
      await handleScrape();
    }
    setIsInProgress(false);
  };

  const handleScrape = async () => {
    if (!state?.provider || !state?.examCode) return;
    let links: string[];
    let res: any;
    // No question links
    if (state?.lastQuestionLinkIndex === undefined || !state.questionLinks) {
      res = await getQuestionLinks(
        state.provider,
        state.examCode,
        state.lastDiscussionListPageIndex ?? 1,
        undefined,
        settings.questionLinks.batchSize,
        settings.questionLinks.sleepDuration
      );
      links = res.data.links;
      setState(prev => ({ ...prev, questionLinks: [...(prev?.questionLinks ?? []), ...links] }));
      if (res.status !== "success") {
        setState(prev => ({ ...prev, lastDiscussionListPageIndex: res.data.lastIndex }));
        return;
      }
    }
    // Failed getting questions previously, resume from last index
    else {
      links = state?.questionLinks.slice(state?.lastQuestionLinkIndex);
    }
    // More questions not parsed
    if (links.length + (state?.lastQuestionLinkIndex ?? 0) > (state?.questions?.length ?? 0)) {
      res = await getQuestions(
        links,
        settings.questions.batchSize,
        settings.questions.sleepDuration
      );
      setState(prev => ({ ...prev, questions: res.data.questions }));
      if (res.status !== "success") {
        setState(prev => ({ ...prev, lastQuestionLinkIndex: res.data.lastIndex }));
        return;
      }
    }
  };

  const handleExport = async () => {
    const blob = new Blob([JSON.stringify(state?.questions)], { type: "text/plain;charset=utf-8" });
    saveAs(
      blob,
      `${state?.provider}-${state.examCode}-${state?.questions?.length}.json`
    );
  };

  const isInputDisabled = !state?.provider || !state?.examCode || state.isInProgress;
  const isInterrupted = state?.lastDiscussionListPageIndex !== undefined || (state?.lastQuestionLinkIndex !== undefined && state?.questionLinks);
  const isCompleted = state?.questionLinks && state?.questions && state?.questionLinks?.length === state?.questions?.length;

  return (
    <div className="h-full max-w-[32rem] mx-auto flex flex-col justify-center">
      <div className="text-2xl font-semibold mb-10 text-center">ExamTopics Scraper</div>
      <div className="flex flex-wrap gap-4 justify-center items-center">
        <Dropdown
          className="flex-1 min-w-60"
          buttonClassName="w-full"
          menuClassName="overflow-y-auto max-h-72"
          value={state?.provider}
          onChange={value => setState(prev => ({ ...prev, provider: value as string }))}
          options={providerOptions}
          placeholder="Select exam provider"
          disabled={state?.isInProgress}
        />
        <InputText
          className="flex-1 min-w-60"
          boxClassName="text-center"
          value={state?.examCode}
          onChange={e => setState(prev => ({ ...prev, examCode: e.target.value }))}
          placeholder="Exam code"
          disabled={state?.isInProgress}
        />
      </div>
      <button
        className="button-default w-full mt-4"
        disabled={isInputDisabled}
        onClick={handleClick}
      >
        {state?.isInProgress ? "Scraping ... " :
          isInterrupted ? "Resume" :
            isCompleted ? "Export" : "Start"
        }
      </button>
      <hr className="my-6" />
      <Settings />
    </div>
  );
}
