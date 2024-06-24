import Dropdown from "@/components/ui/dropdown";
import InputText from "@/components/ui/inputtext";
import { ExamContext, SessionState } from "@/context/exam";
import { Question } from "@/lib/scraper";
import _ from "lodash";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/router";
import { ChangeEvent, Dispatch, FC, PropsWithChildren, SetStateAction, useCallback, useContext, useMemo, useRef, useState } from "react";
import { FaEllipsisVertical, FaStar, FaMagnifyingGlass } from "react-icons/fa6";

type SearchBoxProps = {
  questions: Question[] | undefined;
  sessionState: SessionState;
  setSessionState: Dispatch<SetStateAction<SessionState>>;
};

const Layout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();
  const { examState, exportExamState, saveExamState, sessionState, setSessionState } = useContext(ExamContext);
  const importRef = useRef<HTMLInputElement>(null);
  const { data: session } = useSession();

  const isExamPage = router.pathname === "/exam";
  const hasExamState = examState?.provider && examState?.examCode;

  const menuItems = [
    ...(router.pathname === "/") ? [{
      label: <a href="/exam">Exam</a>,
      value: "import"
    }] : [],
    ...(isExamPage) ? [{
      label: <div onClick={() => importRef.current?.click()}>Import</div>,
      value: "import"
    }] : [],
    ...(hasExamState) ? [{
      label: <div onClick={exportExamState}>Export</div>,
      value: "export"
    }] : [],
    ...(session?.user?.role === "admin") ? [{
      label: <a href="/admin">Admin</a>,
      value: "admin"
    }] : []
  ];

  const handleFileRead = async (e: ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = (e.target?.result);
      if (typeof text !== "string") return;
      const data = JSON.parse(text);
      saveExamState(data);
    };
    const file = e.target.files?.[0];
    if (file) reader.readAsText(file);
  };

  return <>
    <header className="container px-2 py-3 mx-auto relative">
      <div className="h-full max-w-[48rem] mx-auto justify-center flex items-center gap-2 relative">
        {(hasExamState && isExamPage) ?
          <Link className="text-xl font-semibold" href="/">
            ETS
          </Link> :
          <div className="flex-1" />
        }
        <div className="text-center flex-1">
          {(hasExamState && isExamPage) ?
            <SearchBox
              questions={examState.questions}
              sessionState={sessionState}
              setSessionState={setSessionState}
            /> :
            <Link className="block text-xl font-semibold w-max" href="/">
              ExamTopics Scraper
            </Link>
          }
        </div>
        <div className={(hasExamState && isExamPage) ? "" : "flex-1"}>
          <Dropdown
            options={menuItems}
            buttonClassName="ml-auto button-alt items-end border-0 p-0"
            menuClassName="w-20 right-0 mt-4 z-20"
            label={null}
            icon={<FaEllipsisVertical
              size="1.25rem"
            />}
          />
          <input
            ref={importRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileRead}
          />
        </div>
      </div>
    </header>
    <hr />
    <main
      className="container px-2 py-4 mx-auto"
    >
      {children}
    </main>
  </>;
};

const SearchBox: FC<SearchBoxProps> = ({ questions, sessionState, setSessionState }) => {
  const [searchText, setSearchText] = useState("");

  const handleClick = (question: Question) => {
    setSessionState(prev => ({
      currentQuestion: question,
      pastQuestionUrls: [...prev.pastQuestionUrls, question.url!]
    }));
  };

  const options = useMemo(() => {
    if (!searchText || !questions) return [];
    const search = searchText.toLowerCase();

    let filtered = questions
      ?.map(q => {
        const matchIndex = q.body ? q.body.toLowerCase().indexOf(search) : -1;
        return { ...q, matchIndex };
      })
      .filter(q => q.matchIndex !== -1);

    filtered = _.sortBy(
      filtered,
      o => `${("0000" + o.topic).slice(-4)}-${("0000" + o.index).slice(-4)}`);

    return filtered.map((q, i) => {
      const startIndex = q.matchIndex - 50 > 0 ? q.matchIndex - 50 : 0;
      const endMatchIndex = q.matchIndex + searchText.length;
      const endIndex = endMatchIndex + 50 < q.body!.length ? q.matchIndex + 50 : q.body!.length;
      return {
        label: <div key={i} onClick={() => handleClick(q)}>
          <div className="flex gap-2 items-center text-sm">
            T{q.topic} Q{q.index}
            {q.marked && <FaStar className="text-amber-400 ml-auto" size="0.75rem" />}
          </div>
          <div className="text-xs text-gray-500">
            {q.body!.slice(startIndex, q.matchIndex)}
            <span className="font-bold text-black">{q.body!.slice(q.matchIndex, endMatchIndex)}</span>
            {q.body!.slice(endMatchIndex, endIndex)}
          </div>
        </div>,
        value: q.url
      };
    });
  }, [questions, searchText, handleClick]);

  const menuHeader = useMemo(() => {
    return <div className="text-xs text-gray-700">
      {options.length} question{options.length > 0 ? "s" : ""} found
    </div>;
  }, [options]);

  const inputBox = useMemo(() => <InputText
    className="w-full"
    boxClassName="w-full -my-1.5 py-2 font-normal"
    placeholder="Search"
    value={searchText}
    icon={<FaMagnifyingGlass />}
    onChange={e => setSearchText(e.target.value)}
  />, [searchText, setSearchText]);

  return <Dropdown
    options={options}
    value={sessionState.currentQuestion?.url}
    buttonClassName="p-0 border-0 w-full"
    menuClassName="fixed md:absolute left-0 w-full max-h-[50vh] text-left mt-3"
    label={inputBox}
    icon={null}
    toggleMenu={() => true}
    menuHeader={menuHeader}
  />;
};

export default Layout;