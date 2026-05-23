import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import './ListIdeas.css';

export function SuggestListIdeaButton() {
  return (
    <Link to="/suggestions/new" className="list-idea-link">
      <Sparkles aria-hidden="true" size={16} /> Suggest a list
    </Link>
  );
}
